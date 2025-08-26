#! /usr/bin/env node

import type { ICreateProjectOptions } from 'miniprogram-ci/dist/@types/ci/project'
import type { MiniProgramCI } from 'miniprogram-ci/dist/@types/types'
import type { PackageJson } from 'type-fest'
import path from 'node:path'
import NanoJson from '@bit2byte/nano-json'
import p from '@clack/prompts'
import { bundleRequire } from 'bundle-require'
import JoyCon from 'joycon'
import kleur from 'kleur'
import { Project, upload } from 'miniprogram-ci'
import semver from 'semver'

export interface MpCiConfig {
  project: ICreateProjectOptions
  upload?: {
    setting?: MiniProgramCI.ICompileSettings
    robot?: number
    threads?: number
    useCOS?: boolean
    onProgressUpdate?: (task: MiniProgramCI.ITaskStatus | string) => void
  }
}

function cancel(message?: string) {
  p.cancel(message ?? '✖ 已取消')
  process.exit(0)
}

const files = ['mp-ci-helper.config.ts', 'mp-ci-helper.config.mts']

async function main() {
  const cwd = process.cwd()
  const configJoycon = new JoyCon()
  const configPath = await configJoycon.resolve({
    files,
    cwd,
    stopDir: path.parse(cwd).root,
  })
  const { mod } = await bundleRequire({
    filepath: configPath ?? '',
  })

  const config: MpCiConfig = mod.default

  if (!config.project.privateKeyPath) {
    cancel('未配置 privateKeyPath')
  }

  const privateKeyPath = path.join(cwd, config.project.privateKeyPath ?? '')

  const project = new Project({
    appid: config.project.appid,
    type: config.project.type,
    projectPath: config.project.projectPath,
    privateKeyPath,
    ignores: config.project.ignores ?? ['node_modules/**/*'],
  })

  const pkg = new NanoJson<PackageJson>(path.join(cwd, './package.json'))

  await pkg.r()

  const prevVersion = pkg.d?.version ?? '0.0.0'
  const message = pkg.d?.description ?? ''

  const commit = await p.group(
    {
      version: () =>
        p.text({
          message: kleur.cyan('输入本次提交版本号'),
          placeholder: prevVersion,
          initialValue: prevVersion,
          validate(value) {
            if (!semver.valid(value)) {
              return '请输入正确的版本号'
            }
            else if (semver.valid(prevVersion)) {
              if (semver.lte(value, prevVersion)) {
                return '版本号必须大于上次提交版本号'
              }
            }
          },
        }),
      desc: () =>
        p.text({
          message: kleur.cyan('输入提交备注'),
          placeholder: message,
          initialValue: message,
        }),
    },
    {
      onCancel: () => {
        p.cancel('✖ 已取消')
        process.exit(0)
      },
    },
  )

  p.log.info(kleur.green('代码开始上传...'))
  const uploadResult = await upload({
    project,
    version: commit.version,
    desc: commit.desc,
    setting: {
      ...config.upload?.setting,
    },
    robot: config.upload?.robot,
    threads: config.upload?.threads,
    useCOS: config.upload?.useCOS,
    onProgressUpdate: config.upload?.onProgressUpdate,
  })
  if (pkg.d) {
    pkg.d.version = commit.version
  }
  await pkg.w()
  console.log(uploadResult)
  p.log.success(kleur.green('代码上传完成 🎉'))
}

main().catch((e) => {
  p.log.error(kleur.red(e.message))
  process.exit(1)
})
