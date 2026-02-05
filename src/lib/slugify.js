export function createSlug(text) {
  return text
    .toLowerCase()
    .replace(/[^\w ]+/g, '')
    .replace(/ +/g, '-');
}

export async function generateUniqueSlug(Recipe, title, userId, excludeId = null) {
  const baseSlug = createSlug(title);
  const escaped = baseSlug.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`^${escaped}(-[0-9]+)?$`);

  const query = {
    userId,
    slug: { $regex: pattern },
    ...(excludeId && { _id: { $ne: excludeId } }),
  };
  const existingCount = await Recipe.countDocuments(query);

  return existingCount === 0 ? baseSlug : `${baseSlug}-${existingCount}`;
}
