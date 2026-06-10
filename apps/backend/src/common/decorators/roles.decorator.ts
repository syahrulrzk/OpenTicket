import { SetMetadata, createParamDecorator, ExecutionContext } from '@nestjs/common';

export const ROLES_KEY = 'roles';
export const IS_PUBLIC_KEY = 'isPublic';
export const AUDIT_LOG_KEY = 'auditLog';

/**
 * Decorator to specify which roles can access a route.
 * Usage: @Roles(Role.IT_MANAGER, Role.SUPER_ADMIN)
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

/**
 * Decorator to mark a route as public (no JWT required).
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

/**
 * Decorator to extract the current authenticated user from request.
 * Usage: @CurrentUser() user: User
 */
export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    return data ? user?.[data] : user;
  },
);

/**
 * Decorator to enable audit logging on a route.
 * Usage: @AuditLog('ticket')
 */
export const AuditLog = (resourceType: string) =>
  SetMetadata(AUDIT_LOG_KEY, resourceType);