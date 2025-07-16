import { test, expect } from 'vitest'
import { TestEnum, TestSchema2 } from '@exmono/lib1'
import { z } from 'zod'

test('use lib1 zod schema', () => {
	const testObj = {
		isItAwesome: true,
		whatIsIt: TestEnum.Bird,
	}
	expect(TestSchema2.safeParse(testObj).success).toBe(true)
})

test('extend lib1 zod schema', () => {
	const Schema2 = TestSchema2.extend({
		awesomeFactor: z.number(),
	})
	const testObj = {
		isItAwesome: true,
		whatIsIt: TestEnum.Bird,
		awesomeFactor: 12345,
	}
	expect(Schema2.safeParse(testObj).success).toBe(true)
})

// TS 5.8's typechecker does not like this
// with the new default erasableSyntaxOnly turned on
// but the test still passes
// https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-8.html#the---erasablesyntaxonly-option
export enum TestEnum2 {
	Uhhhm = 'uhhhm',
	No = 'no',
}

test('add local enum to lib1 zod schema', () => {
	const Schema3 = TestSchema2.extend({
		wasThisFun: z.enum(TestEnum2),
	})
	const testObj = {
		isItAwesome: true,
		whatIsIt: TestEnum.Bird,
		wasThisFun: TestEnum2.Uhhhm,
	}
	expect(Schema3.safeParse(testObj).success).toBe(true)
})
