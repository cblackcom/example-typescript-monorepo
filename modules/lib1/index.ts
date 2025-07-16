import { z } from 'zod'

export const foo = () => 'bar';

export const TestSchema = z.object({
	isItAwesome: z.boolean(),
})
