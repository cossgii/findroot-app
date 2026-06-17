import { z } from 'zod';

export const createPlaceSchema = z.object({
  name: z.string().min(1, { message: '이름을 입력해주세요.' }),
  latitude: z.number().finite({ message: '올바른 좌표를 입력해주세요.' }),
  longitude: z.number().finite({ message: '올바른 좌표를 입력해주세요.' }),
  address: z.string().optional(),
  district: z.string().optional(),
  description: z.string().min(1, { message: '설명을 입력해주세요.' }),
  link: z.string().url({ message: '유효한 웹사이트 주소를 입력해주세요.' }).optional().nullable(),
  category: z.enum(['MEAL', 'DRINK']),
});

export type CreatePlaceInput = z.infer<typeof createPlaceSchema>;
