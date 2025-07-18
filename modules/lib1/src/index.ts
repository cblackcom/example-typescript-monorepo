import { z } from 'zod'

export const foo = () => 'bar';

export enum TestEnum {
	Bird = 'bird',
	Plane = 'plane',
	IDK = 'idk',
}

export const TestSchema = z.object({
	isItAwesome: z.boolean(),
})

export const TestSchema2 = TestSchema.extend({
	whatIsIt: z.enum(TestEnum),
})

// uncomment the below to create a type error
// that can be caught by `tsc -b` run from within frontend
// export const noGood = typeError
