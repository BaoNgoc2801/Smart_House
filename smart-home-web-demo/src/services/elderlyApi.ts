export interface ActivityData {
  day: string | number;
  value: number;
  isAnomaly: boolean;
  anomalyReason?: string;
}

export interface DashboardData {
  sitting: ActivityData[];
  walking: ActivityData[];
  wakeup: ActivityData[];
  sleeping: ActivityData[];
  alerts: string[];
}

import { API_BASE_URL } from '../constants/config';

export async function fetchElderlyDashboardData(patientId: string): Promise<DashboardData> {
  const householdId = patientId === 'Patient A' ? 'hh124' : patientId;
  const res = await fetch(`${API_BASE_URL}/dashboard/${householdId}`);
  if (!res.ok) {
    throw new Error('Failed to fetch dashboard data');
  }
  return res.json();
}



// API mới ở Backend: Tôi đã phân tích file features_data.csv nặng 500MB+ và tạo một API mới tại app.py. API này sẽ duyệt qua lịch sử các hoạt động, nhóm theo từng ngày và tính tổng số giờ ứng với các hoạt động Sitting (xem TV, đọc sách, máy tính), Active/Walking (Nấu ăn, rửa chén, vệ sinh), Sleeping cũng như số lần thức dậy ban đêm (Wakeup).
// Logic Anomaly: Các luật cảnh báo bất thường được thiết lập dựa trên thực tế dữ liệu của hh124 (Ví dụ: ngồi hơn 10 tiếng, ngủ ít hơn 4 tiếng,...). Dữ liệu tính toán chỉ lấy trong 30 ngày gần nhất của tập dataset để hiển thị lên bảng điều khiển một cách khoa học.
// Frontend: Giao diện Dashboard đã gọi API mới. Trên thanh biểu đồ hiện tại sẽ hiện nhãn Ngày/Tháng thật (thay vì "Day 1", "Day 2" ảo như trước đây).