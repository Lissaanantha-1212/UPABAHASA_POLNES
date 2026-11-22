export const parseComplaintDescription = (description) => {
  if (!description) {
    return {
      description: '-',
      additionalDetails: [],
    };
  }

  const normalizedDescription = String(description)
    .replace(/\\n/g, '\n')
    .replace(/\r\n/g, '\n');

  const marker = 'Informasi Tambahan:';
  const markerIndex = normalizedDescription.indexOf(marker);

  if (markerIndex === -1) {
    return {
      description: normalizedDescription.trim() || '-',
      additionalDetails: [],
    };
  }

  const mainDescription = normalizedDescription
    .slice(0, markerIndex)
    .trim();

  const additionalText = normalizedDescription
    .slice(markerIndex + marker.length)
    .trim();

  const additionalDetails = additionalText
    .split('\n')
    .map((line) => {
      const separatorIndex = line.indexOf(':');

      if (separatorIndex === -1) return null;

      const label = line.slice(0, separatorIndex).trim();
      const value = line.slice(separatorIndex + 1).trim();

      if (!label || !value) return null;

      return { label, value };
    })
    .filter(Boolean);

  return {
    description: mainDescription || '-',
    additionalDetails,
  };
};
