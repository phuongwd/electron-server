import express from 'express'
import fs from 'fs'
import fetch, { RequestInit } from 'node-fetch'
import { logger } from './logger'
import { IFileMetadata } from './releaseCache'

export const shouldProxyPrivateDownload = (
  token: string | undefined
): token is string => !!(token && typeof token === 'string' && token.length > 0)

export const proxyPrivateDownload = (
  file: IFileMetadata,
  res: express.Response,
  token: string
) => {
  const { api_url, name, content_type, cached } = file

  /**
   * if file exists on disk, return it directly
   * it should always exist after it is downloaded
   * but may take a few moments to finish downloading
   */
  if (cached && fs.existsSync('./tmp/' + name)) {
    res.set('Content-Type', content_type)
    res.set('Content-Disposition', `attachment; filename=${name}`)
    const buffer = getFileFromDisk(file)
    res.end(buffer)
    return
  }

  /**
   * While the file finished downloading, we can just pass the req
   * through to GitHub so the user does not have to wait
   */
  logger.warn(`Proxying download to GitHub. ${name} not cached on disk yet.`)
  const redirect = 'manual'
  const headers = { Accept: 'application/octet-stream' }
  const options: RequestInit = { headers, redirect }

  const finalUrl = api_url.replace(
    'https://api.github.com/',
    `https://${token}@api.github.com/`
  )

  fetch(finalUrl, options).then((assetRes) => {
    res.setHeader('Location', assetRes.headers.get('Location')!)
    res.status(302).send()
  })
}

export const downloadFileToDisk = async (
  file: IFileMetadata,
  token?: string
) => {
  if (!fs.existsSync('./tmp')) fs.mkdirSync('./tmp')

  const headers = { Accept: 'application/octet-stream' }
  const options: RequestInit = { headers }
  const { api_url } = file

  let finalUrl = api_url
  if (token) {
    finalUrl = api_url.replace(
      'https://api.github.com/',
      `https://${token}@api.github.com/`
    )
  }

  const assetRes = await fetch(finalUrl, options)
  const filestream = fs.createWriteStream('./tmp/' + file.name)
  return new Promise((res, rej) => {
    assetRes.body?.pipe(filestream)
    assetRes.body?.on('error', rej)
    filestream.on('finish', res)
  })
}

const getFileFromDisk = (file: IFileMetadata) => {
  return fs.readFileSync('./tmp/' + file.name)
}

export const clearFilesFromDisk = () => {
  if (fs.existsSync('./tmp/')) fs.rmSync('./tmp/', { recursive: true })
}

export const toMB = (size: number) => Math.round((size / 1000000) * 10) / 10
