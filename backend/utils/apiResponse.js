export function successResponse(data = null, message = "OK") {
  return { success: true, data, message };
}

export function errorResponse(message = "Request failed", data = null) {
  return { success: false, data, message };
}

