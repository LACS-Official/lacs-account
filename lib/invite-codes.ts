/**
 * 邀请码相关工具函数
 */

/**
 * 生成6位随机邀请码
 * 格式：字母（A-Z）和数字（0-9）组合
 */
export function generateInviteCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * 验证邀请码格式
 * @param code 邀请码
 * @returns 是否为有效格式
 */
export function isValidInviteCodeFormat(code: string): boolean {
  const regex = /^[A-Z0-9]{6}$/;
  return regex.test(code.toUpperCase());
}

/**
 * 标准化邀请码（转为大写）
 * @param code 邀请码
 * @returns 标准化后的邀请码
 */
export function normalizeInviteCode(code: string): string {
  return code.toUpperCase().trim();
}

/**
 * 邀请码数据库类型定义
 */
export interface InviteCode {
  id: number;
  code: string;
  created_at: string;
  is_used: boolean;
  used_at?: string;
  used_by_email?: string;
  created_by?: string;
}

/**
 * 邀请码验证结果
 */
export interface InviteCodeValidation {
  isValid: boolean;
  message: string;
  code?: InviteCode;
}
