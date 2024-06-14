export function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
  }
  
export function validatePassword(password, confirmPassword) {
    if (password.length < 8) {
      return {valid: false, message: 'Password must be at least 8 characters long.'};
    }
    if (password !== confirmPassword) {
      return {valid: false, message: 'Passwords do not match.'};
    }
    return {valid: true, message: 'Valid Password'};
  }
  