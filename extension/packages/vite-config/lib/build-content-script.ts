import { withPageConfig } from './index.js';
import { IS_DEV } from '@extension/env';
import { makeEntryPointPlugin } from '@extension/hmr';
// Fix: Use postcss CLI instead of internal tailwindcss API
import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { build } from 'vite';
import { readdirSync, statSync } from 'node:fs';
import { resolve } from 'node:path';

interface IContentBuilderProps {
  matchesDir: string;
  srcDir: string;
  rootDir: string;
  contentName: 'content' | 'content-ui' | 'content-runtime';
  withTw: boolean;
}

type BuilderPropsType = Omit<IContentBuilderProps, 'withTw'>;

const getContentScriptEntries = (matchesDir: string) => {
  const entryPoints: Record<string, string> = {};
  const entries = readdirSync(matchesDir);

  entries.forEach((folder: string) => {
    const filePath = resolve(matchesDir, folder);
    const isFolder = statSync(filePath).isDirectory();
    const haveIndexTsFile = readdirSync(filePath).includes('config.ts');
    const haveIndexTsxFile = readdirSync(filePath).includes('index.tsx');

    if (isFolder && !(haveIndexTsFile || haveIndexTsxFile)) {
      throw new Error(`${folder} in \`matches\` doesn't have index.ts or index.tsx file`);
    } else {
      entryPoints[folder] = resolve(filePath, haveIndexTsFile ? 'config.ts' : 'index.tsx');
    }
  });

  return entryPoints;
};

const configsBuilder = ({ matchesDir, srcDir, rootDir, contentName }: BuilderPropsType) =>
  Object.entries(getContentScriptEntries(matchesDir)).map(([name, entry]) => ({
    name,
    config: withPageConfig({
      mode: IS_DEV ? 'development' : undefined,
      resolve: {
        alias: {
          '@src': srcDir,
        },
      },
      publicDir: resolve(rootDir, 'public'),
      plugins: [IS_DEV && makeEntryPointPlugin()],
      build: {
        lib: {
          name: name,
          formats: ['iife'],
          entry,
          fileName: name,
        },
        outDir: resolve(rootDir, '..', '..', 'dist', contentName),
      },
    }),
  }));

const execAsync = promisify(exec);

const builds = async ({ srcDir, contentName, rootDir, matchesDir, withTw }: IContentBuilderProps) =>
  configsBuilder({ matchesDir, srcDir, rootDir, contentName }).map(async ({ name, config }) => {
    if (withTw) {
      const folder = resolve(matchesDir, name);
      const inputPath = resolve(folder, 'index.css');
      const outputPath = resolve(rootDir, 'dist', name, 'index.css');
      const configPath = resolve(rootDir, 'tailwind.config.ts');
      
      try {
        // Use tailwindcss CLI instead of internal API
        const cmd = `npx tailwindcss -i ${inputPath} -o ${outputPath} -c ${configPath}${IS_DEV ? ' --watch' : ''}`;
        await execAsync(cmd);
      } catch (error) {
        console.warn(`TailwindCSS build failed for ${name}:`, error);
      }
    }

    //@ts-expect-error This is hidden property from vite's resolveConfig()
    config.configFile = false;
    return build(config);
  });

// FIXME: USE THIS FOR ALL CONTENT SCRIPTs
export const contentBuilder = async ({
  matchesDir,
  srcDir,
  rootDir,
  contentName,
  withTw = true,
}: IContentBuilderProps) =>
  builds({
    srcDir,
    contentName,
    rootDir,
    matchesDir,
    withTw,
  });
