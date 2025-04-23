// Error monitoring service
const errorMonitoring = {
  init() {
    // Initialize error monitoring
    window.addEventListener('error', this.handleError);
    window.addEventListener('unhandledrejection', this.handlePromiseError);
  },

  handleError(error: ErrorEvent) {
    console.error('Caught error:', error);
    // Send error to monitoring service
    this.sendError({
      type: 'error',
      message: error.message,
      stack: error.error?.stack,
      filename: error.filename,
      lineno: error.lineno,
      colno: error.colno,
      timestamp: new Date().toISOString()
    });
  },

  handlePromiseError(error: PromiseRejectionEvent) {
    console.error('Unhandled promise rejection:', error);
    // Send error to monitoring service
    this.sendError({
      type: 'promise',
      message: error.reason?.message || 'Unknown promise rejection',
      stack: error.reason?.stack,
      timestamp: new Date().toISOString()
    });
  },

  async sendError(errorData: any) {
    try {
      // Send error to your monitoring service
      await fetch('/api/error-log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(errorData),
      });
    } catch (error) {
      console.error('Failed to send error to monitoring service:', error);
    }
  },

  logError(error: Error, context?: any) {
    console.error('Application error:', error);
    this.sendError({
      type: 'application',
      message: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString()
    });
  }
};

// Initialize error monitoring
errorMonitoring.init();

export default errorMonitoring; 