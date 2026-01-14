export function LoginFortmValidation(form) {

    if (form.username.trim() === "" || form.password.trim() === "") {
        return "User ID and Password cannot be empty.";
    }
    if (form.username.length < 4 || form.password.length < 4) {
        return "User ID and Password must be at least 4 characters long.";
    } else if (form.username.length > 20 || form.password.length > 20) {
        return "User ID and Password cannot exceed 20 characters.";
    }
    return null;
}