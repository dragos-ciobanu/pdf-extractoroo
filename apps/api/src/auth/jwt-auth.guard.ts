import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class JwtAuthGuard implements CanActivate {
    constructor(private readonly jwt: JwtService) {}

    async canActivate(ctx: ExecutionContext): Promise<boolean> {
        const req = ctx.switchToHttp().getRequest();
        const auth = req.headers['authorization'] as string | undefined;
        if (!auth?.startsWith('Bearer ')) throw new UnauthorizedException();

        const token = auth.slice('Bearer '.length);
        try {
            const payload = await this.jwt.verifyAsync(token, { secret: process.env.JWT_SECRET! });
            req.user = { id: payload.sub, username: payload.username };
            return true;
        } catch {
            throw new UnauthorizedException();
        }
    }
}