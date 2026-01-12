import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthenticatedAgent } from '../dto/auth.dto';

export const CurrentUser = createParamDecorator(
  (data: keyof AuthenticatedAgent | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as AuthenticatedAgent;

    return data ? user?.[data] : user;
  },
);
