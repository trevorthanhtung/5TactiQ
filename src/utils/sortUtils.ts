/**
 * Compares two Vietnamese names by Given Name (Tên - the last word) first, 
 * and then by Family / Middle name if given names are equal.
 * 
 * Example:
 * - "Mai Tấn Anh" vs "Trần Quốc Anh" -> compares "Anh Mai Tấn" vs "Anh Trần Quốc"
 * - "Nguyễn Khoa" vs "Lê Thanh Lộc" -> compares "Khoa Nguyễn" vs "Lộc Lê Thanh"
 */
export const compareVietnameseNames = (nameA: string, nameB: string): number => {
  const getSortKey = (fullName: string) => {
    const parts = (fullName || '').trim().split(/\s+/);
    if (parts.length <= 1) return fullName || '';
    const firstName = parts[parts.length - 1];
    const rest = parts.slice(0, parts.length - 1).join(' ');
    return `${firstName} ${rest}`;
  };

  return getSortKey(nameA).localeCompare(getSortKey(nameB), 'vi', { sensitivity: 'base' });
};
