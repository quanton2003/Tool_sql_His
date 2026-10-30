import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  private readonly users = [
    {
      username: 'quannh',
      password: '$2b$10$RoForlhE/fYumPPP9VjMCOZVBPVp7LfIbUW.0iYcyH91a0cI8SYLy',
    },
    {
      username: 'admin',
      password: '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', // admin123
    },
  ];

  constructor(private readonly jwtService: JwtService) {}

  async validateUser(username: string, password: string): Promise<any> {
    const user = this.users.find((u) => u.username === username);
    if (!user) {
      throw new UnauthorizedException('Sai tên đăng nhập hoặc mật khẩu');
    }

    let isMatch = await bcrypt.compare(password, user.password);
    // Local fallback convenience: allow admin123 or 123456 or ADMIN_PASSWORD
    if (!isMatch) {
      const allowedFallbacks = ['admin123', '123456', process.env.ADMIN_PASSWORD].filter(Boolean);
      if (allowedFallbacks.includes(password)) {
        isMatch = true;
      }
    }

    if (!isMatch) {
      throw new UnauthorizedException('Sai tên đăng nhập hoặc mật khẩu');
    }

    const { password: _, ...result } = user;
    return result;
  }

  async login(user: any) {
    const payload = { username: user.username, sub: user.username };
    return {
      access_token: this.jwtService.sign(payload),
      username: user.username,
    };
  }
}
