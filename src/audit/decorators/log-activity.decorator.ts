import { SetMetadata } from '@nestjs/common';

/**
 * Key để truy xuất metadata trong Interceptor.
 */
export const LOG_ACTION_KEY = 'log_action';

/**
 * Interface định nghĩa cấu trúc của metadata cho việc ghi log.
 * Giúp đảm bảo tính nhất quán khi sử dụng decorator.
 */
export interface LogMetadata {
  /**
   * Tên của hành động được thực hiện (ví dụ: 'CREATE_PROJECT', 'UPDATE_USER').
   * Thường là một giá trị hằng số để dễ dàng truy vấn và lọc.
   */
  action: string;

  /**
   * Tên của loại thực thể bị tác động (ví dụ: 'PROJECT', 'USER', 'ROLE').
   * Giúp nhóm các hoạt động lại với nhau.
   */
  entity: string;
}

/**
 * Custom Decorator @LogActivity
 * Dùng để đánh dấu một route handler (phương thức trong controller) cần được ghi lại hoạt động.
 *
 * @param metadata - Một object chứa thông tin về hành động và thực thể.
 * @example
 * // Sử dụng trong một controller:
 * @Post()
 * @LogActivity({ action: 'CREATE_PROJECT', entity: 'PROJECT' })
 * createProject(@Body() dto: CreateProjectDto) {
 *   // ...
 * }
 */
export const LogActivity = (metadata: LogMetadata) =>
  SetMetadata(LOG_ACTION_KEY, metadata);
