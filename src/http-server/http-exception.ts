import { getReasonPhrase } from 'http-status-codes';
import { Request } from 'express';
/**
 * Định nghĩa riêng một Class HttpException kế thừa class Error sẵn (điều này cần thiết và là Best Practice vì class Error nó là class built-in sẵn)
 */
export class HttpException extends Error {
  statusCode: number;
  request: Request | undefined;
  constructor(statusCode: number, message?: string, request?: Request) {
    // Gọi tới hàm khởi tạo của class Error (class cha) để còn dùng this (kiến thức OOP lập trình hướng đối tượng căn bản)
    // Thằng cha (Error) có property message rồi nên gọi nó luôn trong super cho gọn

    if (!message) message = getReasonPhrase(statusCode);

    super(message);

    if (request) this.request = request;

    // Tên của cái custom Error này, nếu không set thì mặc định nó sẽ kế thừa là "Error"
    this.name = 'HttpException';

    // Gán thêm http status code của chúng ta ở đây
    this.statusCode = statusCode;

    // Ghi lại Stack Trace (dấu vết ngăn xếp) để thuận tiện cho việc debug
    Error.captureStackTrace(this, this.constructor);
  }
}
