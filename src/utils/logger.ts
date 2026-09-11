type LogLevel =
  | "INFO"
  | "WARN"
  | "ERROR";

interface LogContext {
  requestId?: string;
  method?: string;
  path?: string;
  statusCode?: number;
  durationMs?: number;
  userId?: string;
  businessId?: string;
  [key: string]: unknown;
}

const writeLog = (
  level: LogLevel,
  message: string,
  context?: LogContext,
) => {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...context,
  };

  console.log(
    JSON.stringify(entry),
  );
};

export const logger = {
  info: (
    message: string,
    context?: LogContext,
  ) =>
    writeLog(
      "INFO",
      message,
      context,
    ),

  warn: (
    message: string,
    context?: LogContext,
  ) =>
    writeLog(
      "WARN",
      message,
      context,
    ),

  error: (
    message: string,
    context?: LogContext,
  ) =>
    writeLog(
      "ERROR",
      message,
      context,
    ),
};