# example typescript monorepo.

Updated July 2025

## Goals — Completed 🏆

* Example Typescript monorepo containing a main web app and some dependency modules
* [vite](https://vite.dev) for builds (and also dev server)
* [pnpm](https://pnpm.io) instead of `npm` for **monorepo-capable** package management
* Ability to change code in dependency modules, and use those changes immediately in the web app without recompiling anything
* Ability to use [tsc](https://www.typescriptlang.org/docs/handbook/compiler-options.html) type checker to review type errors in the project
* Ability to use [zod](https://zod.dev) schemas with ~~`.nativeEnum()`~~ `.enum()` (updated for Zod 4) across packages without issue, in both application code and [vitest](http://vitest.dev) tests
* Identify **minimal** required configuration

## Observations

* With the right setup, you don't need to compile packages in your monorepo before you use them by other packages in the same monorepo. Type declaration `d.ts` files also do not need to be generated for type checking to work within VSCode.  (Publishing packages to npm or for use outside of the repo is outside the scope of this experiment.)
* Typescript has its way of resolving packages using `paths` parameters in `tsconfig`, and that drives all of VSCode's intellisense for imports and code.  This is proved in Step 2.
* Separately, PNPM, with its workspace feature, creates a symlink inside a consuming package's `node_modules` directory to a dependency package within the monorepo.  This has the effect of the dependency's code showing up in `node_modules` just like any other npm-installed package.  The Vite dev server and compiler is then able to find and use the packages without any particular configuration.  This is proved in Steps 3 and 4.

## Type Checking

To run the type checker for the whole repo:
```bash
cd frontend
pnpm tsc -b --force
```

Note that `-b` flag means "build", but really just gives us the type checking output we are looking for, and `--force` causes the dependency package's types to be re-emitted (see Step 8) for up-to-date analysis.  Both should be included on every run.

## Same external dependencies across packages

The [PNPM catalog](https://pnpm.io/catalogs) feature used in these examples is useful for connecting the same external dependency  (such as `zod` or `@emotion/react`) version/instance to each internal package that requires it.  Unfortunately I messed it up not knowing what I was doing, when I upgraded the `@emotion` package in a real project, and it applied the update to one of my packages but not the other.  This caused for some very strange bugs (specifically, the context to provide `theme` object via React context to styled components was not populating in components from one of my two internal packages).  To fix, I did this:

```bash
# from project root
# check the different copies of a package across your repo, e.g.
pnpm why @emotion/react

# got more than one copy?  try updating all the packages, and reinstalling...
pnpm -r update
pnpm i

# see also: https://chatgpt.com/share/68799b02-c1c0-800b-aeef-8631627e031b
```

## Other notes

* At one point I came across the plugin [vite-tsconfig-paths](`https://www.npmjs.com/package/vite-tsconfig-paths`) which seemed like (if I'm understanding correctly) it might eliminate Step 3.  However, the documentation notes some limitations due to Vite API, and it obviously adds automagical complexity to make the compiles work.  In the end, using PNPM workspaces in Step 3 feels logical and straightforward to me now, so I didn't try the plugin out.
* Although the official Typescript documentation suggests a workspace root tsconfig file, I found it in practice to be more trouble than it was worth.

---

## Proof

The experiment was ultimately set up according to the below steps.  You you can follow along using the commit hashes posted for each step.

### Step 1

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

### Step 2

Prove out minimal Typescript resolution between modules without any builds.

Create absolute minimal dependency module `lib1` (refer to commit hash below for file content)—
* `modules/lib1/index.ts`
* `modules/lib1/tsconfig.json`
* Add the `lib1` module to the `paths` block in `frontend/tsconfig.app.json`

With these minimal changes, and without other install or build commands, the `foo()` function provided by `lib1` can be imported into `App.tsx` code and will show as valid in VSCode's built-in type checker.

Commit `a137aa1914e9705fb502f9ea06028efe77e0c3a0`

### Step 3

Set up `frontend` Vite compile to find the `lib1` code.

* Add a `pnpm-workspace.yaml` file in the root, with package references to both modules
* Add a minimal `package.json` file to `modules/lib1` that specifies the package name, type (`module`) and main entry point
* Add `lib1` in the `dependencies` block of `frontend/package.json`, referencing `workspace:*` instead of the file system

Commit `0d4243d000c2f96b871c9613547728422e737ee6`

### Step 4

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

### Step 5

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

### Step 6

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

### Step 7

At this point we're looking pretty good, except for the default `frontend` tsconfig provided by the Vite scaffold putting a red squiggly under our Enums.  Since we use Enums quite a lot, we will turn that rule off.  (Wether this is a "good" idea or not is up to you...  I don't completely hate these things.)

* Drop `erasableSyntaxOnly` from `frontend` tsconfig

Commit `2d358d18d6e9d1840b3d0bb82155ea4fbacd9585`

### Step 8

Implement Typescript [Project References](https://www.typescriptlang.org/docs/handbook/project-references.html) to allow different Typescript configurations within the separate packages and to help along the `tsc` command line type checker.

* Add `emitDeclarationOnly` and `outDir` to `lib1` tsconfig
* Add the `outDir` directory to `.gitignore`
* Add `reference` block to `frontend` tsconfig pointing to `lib1`

To try out the type checker, uncomment the `export const noGood` line (21) at the bottom of `modules/lib1/index.ts` to create a type error.  Then:

```bash
# from repo root
cd frontend
pnpm tsc -b --force
```

You should see an error pointing to the issue within `lib1`.  If you also go looking on the file system, you can find the `*.d.ts` files generated in `modules/lib1/dist-tsc`.

With current Typescript 5.8 it doesn't appear possible to have `noEmit` (never generate `d.ts` files) on `lib1` and to have the command-line type checker work correctly from within `frontend`.  However, we never have to compile these `d.ts` files manually, and we can configure them to build out of sight, so it still meets the project goals.

Commit `1d280fe08a6cdbb4f9854e77946c3adf4d7529cc`

### Step 9

Some additional tsconfig tweaks pulled over from the implementation of this strategy on a real project, including moving the code for `lib1` into a more realistic `src` directory.

Commit `8abeb4bb495375f3e29810cd19ca380d476cb406`
