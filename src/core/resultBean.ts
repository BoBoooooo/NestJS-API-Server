/*
 * @file: ResultBean
 * @copyright: BoBo
 * @author: BoBo
 * @Date: 2020年08月10 15:56:42
 */

import { StatusCode } from './code.enum'

export interface ResultBean {
  code: number
  message: string
  data: any
}

export class ResultGenerator {
  static success(data: any = {}, message = 'success'): ResultBean {
    const result: ResultBean = {
      code: StatusCode.SUCCESS,
      message,
      data
    }
    return result
  }

  static fail(code: number, message: string) {
    const result: ResultBean = {
      code,
      message,
      data: undefined
    }
    return result
  }
}
