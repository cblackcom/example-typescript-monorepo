# example typescript monorepo.

Goals—
* Example Typescript monorepo containing a main web app and some dependency modules
* [vite](https://vite.dev) for builds
* [pnpm](https://pnpm.io) instead of `npm` for **monorepo-capable** package management
* Ability to change code in dependency modules, and use those changes immediately in the web app without recompiling 
* Ability to use [zod](https://zod.dev) schemas with `.nativeEnum()` across packages without issue, in both application code and [vitest](http://vitest.dev) tests
* Identify **minimal** required configuration

Ultimately these goals were met by taking the following steps.  Each step has a commit that can be referred to for the whole change set.

## Step 1

Create a starter main web app using the Vite scaffolding defaults.

```bash
# get nvm installed and a modern version of node
# then install pnpm 10 (or latest) with np
# using instructions on pnpm.io
npm install -g pnpm@latest-10

# start new monorepo
mkdir webapp-monorepo-example
git init

# create "frontend" main web app using scaffolding on
# Vite getting started guide
# https://vite.dev/guide/
# and select `react-ts` template, because that's what we do these days
pnpm create vite@latest frontend
```

Commit `1cb403383f9650bc2abebf111f3c4ab106356080`

## Step 2

Prove out minimal Typescript resolution between modules without any builds.

Create absolute minimal dependency module `lib1` (refer to commit hash below for file content)—
* `modules/lib1/index.ts`
* `modules/lib1/tsconfig.json`
* Add the `lib1` module to the `paths` block in `frontend/tsconfig.app.json`

With these minimal changes, and without other install or build commands, the `foo()` function provided by `lib1` can be imported into `App.tsx` code and will show as valid in VSCode's built-in type checker.

Commit `a137aa1914e9705fb502f9ea06028efe77e0c3a0`

## Step 3

Set up `frontend` Vite compile to find the `lib1` code.

* Add a `pnpm-workspace.yaml` file in the root, with package references to both modules
* Add a minimal `package.json` file to `modules/lib1` that specifies the package name, type (`module`) and main entry point
* Add `lib1` in the `dependencies` block of `frontend/package.json`, referencing `workspace:*` instead of the file system

Commit `0d4243d000c2f96b871c9613547728422e737ee6`

## Step 4

Then use `pnpm` to install the dependencies of `frontend`.

```bash
cd frontend
pnpm i
```

Now, if you `ls` out the `frontend/node_modules/@exmono/lib1` directory, you'll find it just symlinks to the code on disk.

```bash
# from within `frontend`
ls -l node_modules/@exmono/lib1

# lrwxr-xr-x  1 cblack  staff  21 Jul 15 18:06 node_modules/@exmono/lib1 -> ../../../modules/lib1
```

Along with the `pnpm-lock.yaml` file created by the install, check in a `.gitignore` to keep `node_modules` from being committed to the repo accidentally.

Commit `b73a56f26111f9e2beb7588a2277a158bcf67fbd`

## Step 5

Add a [zod](https://zod.dev) schema to `lib1` and try to use it from `frontend`.

* Add `zod` to the [pnpm workspace catalog](https://pnpm.io/catalogs) in `pnpm-workspace.yaml`
* Add `zod` in the `dependencies` block of `modules/lib1/package.json`, referencing `catalog:*`
* Install `lib1` dependencies

```bash
# from repo root
cd modules/lib1
pnpm i
```

* In `modules/lib1/index.ts`, import `zod` and export out a a simple test schema
* In `frontend/src/App.tsx`, add some code to test use of the schema

The word "AWESOME!" should appear on the demo page if you view the web app by running `pnpm dev` within `frontend`.

Commit `e1785d00cc649fe7046f54641e9173adc4828795`

## Step 6

Add more interesting tests mixing schemas and enums between `frontend` and `lib1`.

* Add `vitest` to the [pnpm workspace catalog](https://pnpm.io/catalogs)
* Add `zod` and `vitest` in the `dependencies` block of `frontend/package.json`, referencing `catalog:*`
* Add `test` script to `frontend/package.json` for `vitest`
* Install `frontend` dependencies

```bash
# from repo root
cd frontend
pnpm i
```

* Add some example tests using `zod` schemas from `lib1` to `frontend/zod.test.ts`, and some additional supporting code in `lib1`.
* Run the tests

```bash
# from within `frontend`
pnpm test
```

These tests would have failed in our previous monorepo setup, but they succeed here.

Commit `03ca96228c6b5bbcf39e0691151a267d5306ca13`

## Step 7

At this point we're looking pretty good, except for the default `frontend` tsconfig provided by the Vite scaffold putting a red squiggly under our Enums.  Since we use Enums quite a lot, we will turn that rule off.

* Drop `erasableSyntaxOnly` from `frontend` tsconfig

Commit `2d358d18d6e9d1840b3d0bb82155ea4fbacd9585`
