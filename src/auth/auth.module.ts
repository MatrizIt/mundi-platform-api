import { Module } from "@nestjs/common"
import { AuthService } from "./auth.service"
import { PassportModule } from "@nestjs/passport"
import { UserModule } from "src/controller/user/user.module"
import { LocalStrategy } from "./local.strategy"
import { jwtConstants } from "./constants"
import { JwtModule } from "@nestjs/jwt"
import { JwtStrategy } from "./jwt.strategy"

@Module({
    imports: [
        UserModule,
        PassportModule,
        JwtModule.register({
            global: true,
            secret: jwtConstants.secret
        })
    ],
    providers: [AuthService, LocalStrategy, JwtStrategy],
    exports: [JwtModule, AuthService]
})
export class AuthModule {}