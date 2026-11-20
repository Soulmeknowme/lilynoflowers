/**
 * Phát hiện dấu hiệu khủng hoảng bằng từ khóa (nhanh, không tốn API).
 * Đây là lớp bảo vệ đầu tiên; system prompt cũng yêu cầu model tự nhận diện
 * các trường hợp không khớp từ khóa.
 */
export type CrisisType = "self_harm" | "violence";

const PATTERNS: Record<CrisisType, RegExp[]> = {
  self_harm: [
    /tự\s*tử/, /tự\s*sát/, /tự\s*hại/, /tự\s*làm\s*đau/,
    /muốn\s*chết/, /không\s*muốn\s*sống/, /chẳng\s*muốn\s*sống/,
    /kết\s*thúc\s*(cuộc\s*đời|tất\s*cả|mọi\s*thứ)/, /chấm\s*dứt\s*cuộc\s*sống/,
    /biến\s*mất\s*mãi\s*mãi/, /sống\s*không\s*còn\s*ý\s*nghĩa/,
    /rạch\s*tay/, /cắt\s*tay/, /nhảy\s*(cầu|lầu)/, /uống\s*thuốc\s*ngủ/, /treo\s*cổ/,
    /suicide/, /kill\s*myself/, /end\s*my\s*life/,
  ],
  violence: [
    /bạo\s*hành/, /đánh\s*đập/, /bị\s*(chồng|vợ|người\s*yêu|bố|mẹ|anh|chị)?\s*đánh/,
    /đe\s*dọa\s*(giết|đánh)/, /dọa\s*giết/, /cưỡng\s*hiếp/, /hiếp\s*dâm/, /xâm\s*hại/,
    /bóp\s*cổ/, /không\s*dám\s*về\s*nhà/, /sợ\s*(anh\s*ấy|cô\s*ấy|chồng|vợ)\s*sẽ\s*(giết|đánh)/,
  ],
};

export function detectCrisis(text: string): CrisisType | null {
  const t = text.toLowerCase().normalize("NFC");
  for (const type of ["self_harm", "violence"] as CrisisType[]) {
    if (PATTERNS[type].some((re) => re.test(t))) return type;
  }
  return null;
}

// Hãy kiểm tra lại các số này trước khi ra mắt
export const HOTLINES = [
  { name: "Cấp cứu y tế", number: "115" },
  { name: "Công an", number: "113" },
  { name: "Tổng đài quốc gia bảo vệ trẻ em", number: "111" },
  { name: "Đường dây nóng Ngày Mai (hỗ trợ tâm lý)", number: "096 306 1414" },
];
