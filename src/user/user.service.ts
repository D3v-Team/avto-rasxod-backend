import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { Op, WhereOptions } from 'sequelize';
import { User } from './models/user.model';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ResetPasswordDto } from './dto/resetPassword.dto';
import { QueryUserDto } from './dto/query-user.dto';
import { UserRole } from '../common/enums/user-role.enum';
import { normalizeName } from '../common/utils/normalize-name.util';

const BCRYPT_ROUNDS = 10;
const PAGE_LIMIT = 15;

@Injectable()
export class UserService implements OnModuleInit {
  private readonly logger = new Logger(UserService.name);

  constructor(
    @InjectModel(User) private readonly userRepo: typeof User,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    const exists = await this.userRepo.findOne({
      where: { role: UserRole.SUPER_ADMIN },
    });
    if (exists) return;

    const plainPassword = this.configService.get<string>('ADMIN_PASSWORD');
    if (!plainPassword) {
      this.logger.error(
        "ADMIN_PASSWORD muhit o'zgaruvchisi topilmadi! Super admin yaratilmadi.",
      );
      return;
    }

    try {
      const hashed_password = await this.hashPassword(plainPassword);
      await this.userRepo.create({
        full_name: 'SUPER ADMIN',
        username: this.configService.get<string>('ADMIN_USERNAME', 'admin'),
        hashed_password,
        role: UserRole.SUPER_ADMIN,
      });
      this.logger.log('Super admin muvaffaqiyatli yaratildi');
    } catch (error) {
      this.logger.error('Super admin yaratishda xatolik', error);
      throw new InternalServerErrorException(
        'Super admin yaratishda xatolik yuz berdi',
      );
    }
  }

  async createUser(dto: CreateUserDto) {
    // Normalizatsiya kiritilgan matn maydonlariga qo'llanadi
    const normalizedUsername = normalizeName(dto.username);
    const normalizedFullName = normalizeName(dto.full_name);

    // Unikal tekshiruv normalizatsiya qilingan username bo'yicha bajariladi
    const existing = await this.userRepo.findOne({
      where: { username: normalizedUsername },
    });
    if (existing) {
      throw new ConflictException(
        `"${normalizedUsername}" username allaqachon mavjud`,
      );
    }

    const hashed_password = await this.hashPassword(dto.password);
    await this.userRepo.create({
      ...dto,
      username: normalizedUsername,
      full_name: normalizedFullName,
      hashed_password,
      role: UserRole.ADMIN,
    });

    return { message: 'Admin muvaffaqiyatli yaratildi' };
  }

  async getAdminUsers() {
    return this.userRepo.findAll({ where: { role: UserRole.ADMIN } });
  }

  async getUserById(id: string) {
    const user = await this.userRepo.findByPk(id, { include: { all: true } });
    if (!user) throw new NotFoundException(`ID ${id} bo'yicha foydalanuvchi topilmadi`);
    return user;
  }

  async getPaginatedUsers(isDeleted: boolean, page: number) {
    const is_deleted = isDeleted ?? false;
    return this.paginateByRole(page, {
      role: UserRole.ADMIN,
      is_deleted,
    });
  }

  async updateUser(id: string, dto: UpdateUserDto) {
    const normalizedDto: any = { ...dto };

    // Normalizatsiya va unikal tekshiruvi faqatsiz yuborilgan qiymatlar uchun bajariladi
    if (dto.username !== undefined) {
      normalizedDto.username = normalizeName(dto.username);
      const duplicate = await this.userRepo.findOne({
        where: { username: normalizedDto.username, id: { [Op.ne]: id } },
      });
      if (duplicate) {
        throw new ConflictException(
          `"${normalizedDto.username}" username allaqachon mavjud`,
        );
      }
    }

    if (dto.full_name !== undefined) {
      normalizedDto.full_name = normalizeName(dto.full_name);
    }

    const user = await this.getUserById(id);
    await user.update(normalizedDto);

    return { message: 'Admin muvaffaqiyatli yangilandi' };
  }

  async resetUserPassword(id: string, dto: ResetPasswordDto) {
    await this.getUserById(id);
    const hashed_password = await this.hashPassword(dto.new_password);
    await this.userRepo.update({ hashed_password }, { where: { id } });

    return { message: "Parol muvaffaqiyatli o'zgartirildi" };
  }

  async deleteUser(id: string) {
    const user = await this.getUserById(id);
    await user.update({ is_deleted: true });

    return { message: 'Admin muvaffaqiyatli arxivlandi' };
  }

  async restoreUser(id: string): Promise<{ message: string }> {
    try {
      const user = await this.userRepo.scope('onlyDeleted').findByPk(id);
      if (!user) {
        throw new NotFoundException(
          `ID ${id} bo'yicha arxivlangan admin topilmadi`,
        );
      }
      await user.update({ is_deleted: false });
      return { message: 'Admin muvaffaqiyatli tiklandi' };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      console.error('Restore user error:', error);
      throw new InternalServerErrorException('Adminni tiklashda xatolik yuz berdi');
    }
  }

  async findAll(query: QueryUserDto) {
    try {
      const { is_deleted, search } = query;

      let scope: string | undefined = undefined;
      if (is_deleted === true) {
        scope = 'onlyDeleted';
      }

      const repo = scope ? this.userRepo.scope(scope) : this.userRepo;

      const where: any = { role: UserRole.ADMIN };
      if (search) {
        const normalizedSearch = normalizeName(search);
        where[Op.or] = [
          { full_name: { [Op.iLike]: `%${normalizedSearch}%` } },
          { username: { [Op.iLike]: `%${normalizedSearch}%` } },
        ];
      }

      const records = await repo.findAll({
        where,
      });

      return { data: records };
    } catch (error) {
      console.error('FindAll users error:', error);
      throw new InternalServerErrorException(
        'Foydalanuvchilarni olishda xatolik yuz berdi',
      );
    }
  }

  private async paginateByRole(page: number, where: WhereOptions) {
    const { limit, offset } = this.buildPagination(page);
    const [records, total_count] = await Promise.all([
      this.userRepo.findAll({ where, offset, limit }),
      this.userRepo.count({ where }),
    ]);
    return this.buildPageResponse(records, total_count, page);
  }

  private buildPagination(page: number) {
    const limit = PAGE_LIMIT;
    const offset = (Math.max(Number(page) || 1, 1) - 1) * limit;
    return { limit, offset };
  }

  private buildPageResponse<T>(
    records: T[],
    total_count: number,
    page: number,
  ) {
    return {
      status: 200,
      data: {
        records,
        pagination: {
          currentPage: Math.max(Number(page) || 1, 1),
          total_pages: Math.ceil(total_count / PAGE_LIMIT),
          total_count,
        },
      },
    };
  }

  private async hashPassword(password: string): Promise<string> {
    try {
      return await bcrypt.hash(password, BCRYPT_ROUNDS);
    } catch {
      throw new InternalServerErrorException(
        'Parolni xesh qilishda xatolik yuz berdi',
      );
    }
  }
}
