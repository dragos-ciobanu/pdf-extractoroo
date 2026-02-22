import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as argon2 from 'argon2';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly jwt: JwtService,
    ) {}

    async login(username: string, password: string) {
        const user = await this.prisma.user.findUnique({ where: { username } });
        if (!user) throw new UnauthorizedException('Invalid credentials');

        const ok = await argon2.verify(user.passwordHash, password);
        if (!ok) throw new UnauthorizedException('Invalid credentials');

        const accessToken = await this.jwt.signAsync({ sub: user.id, username: user.username });
        return { accessToken };
    }
}