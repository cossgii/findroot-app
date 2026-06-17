import { z } from 'zod';

export const PASSWORD_REGEX = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[@$&*?!%])[A-Za-z\d!@$%&*?]{8,15}$/;

export const loginSchema = z.object({
  loginId: z.string().min(1, { message: '로그인 아이디를 입력해주세요' }),
  password: z.string().min(1, { message: '비밀번호를 입력해주세요' }),
});

export const signupSchema = z
  .object({
    name: z.string().min(2, { message: '이름은 2글자 이상이어야 합니다' }),
    loginId: z.string().min(1, { message: '로그인 아이디를 입력해주세요' }),
    email: z
      .string()
      .min(1, { message: '이메일을 입력해주세요' })
      .email({ message: '이메일 형식이 아닙니다' }),
    password: z
      .string()
      .min(1, { message: '비밀번호를 입력해주세요' })
      .min(8, { message: '비밀번호는 8자리 이상이어야 합니다' })
      .refine((val) => PASSWORD_REGEX.test(val), {
        message: '영문, 숫자, 특수문자(~!@#$%^&*)를 모두 조합해 주세요',
      }),
    confirmPassword: z.string().min(1, { message: '비밀번호를 다시 입력해주세요' }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ['confirmPassword'],
    message: '비밀번호가 일치하지 않습니다.',
  });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, { message: '현재 비밀번호를 입력해주세요.' }),
    newPassword: z
      .string()
      .min(1, { message: '새 비밀번호를 입력해주세요.' })
      .refine((val) => PASSWORD_REGEX.test(val), {
        message: '영문, 숫자, 특수문자(@$&*?!%)를 모두 포함한 8~15자여야 합니다.',
      }),
    confirmNew: z.string().min(1, { message: '새 비밀번호를 다시 입력해주세요.' }),
  })
  .refine((data) => data.newPassword === data.confirmNew, {
    path: ['confirmNew'],
    message: '새 비밀번호가 일치하지 않습니다.',
  });
