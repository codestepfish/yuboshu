import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'

const request: AxiosInstance = axios.create({
  baseURL: process.env.VUE_APP_API,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
})

// 异常处理
const errorHandler = (error: any): any => {
  return Promise.reject(error)
}

// 请求拦截器
request.interceptors.request.use((config: AxiosRequestConfig) => {
  return config
}, errorHandler)

// 响应拦截器
request.interceptors.response.use((response: AxiosResponse): Promise<AxiosResponse<any>> | AxiosResponse<any> => {
  return response
}, errorHandler)

export default request
