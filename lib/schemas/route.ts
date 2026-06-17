import { z } from 'zod';

const routePlaceSchema = z.object({
  placeId: z.string(),
  order: z.number().int(),
  label: z.enum(['MEAL', 'CAFE', 'BAR']),
});

export const createRouteSchema = z.object({
  name: z.string().min(1, { message: '루트 이름을 입력해주세요.' }),
  description: z.string().min(1, { message: '설명을 입력해주세요.' }).optional(),
  districtId: z.string().min(1, { message: '자치구를 선택해주세요.' }),
  places: z
    .array(routePlaceSchema)
    .min(2, { message: '경유지를 최소 2개 추가해주세요.' })
    .max(5, { message: '경유지는 최대 5개까지 추가할 수 있습니다.' }),
  purpose: z.enum(['FAMILY', 'GATHERING', 'SOLO', 'COUPLE', 'ENTIRE']),
});

export const updateRouteSchema = z.object({
  name: z.string().min(1, { message: '루트 이름을 입력해주세요.' }),
  places: z
    .array(routePlaceSchema)
    .min(2, { message: '경유지를 최소 2개 추가해주세요.' })
    .max(5, { message: '경유지는 최대 5개까지 추가할 수 있습니다.' })
    .optional(),
});

export type CreateRouteInput = z.infer<typeof createRouteSchema>;
