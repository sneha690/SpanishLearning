<?php
// Check if the form is submitted
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    // Get the email address from the form
    $email = $_POST['email'];

    // Check if the email field is not empty
    if (!empty($email)) {
        // Email settings
        $subject = "Password Reset Request";
        $message = "To reset your password, click the following link: \n";
        $message .= "http://yourwebsite.com/reset-password-form.php?email=" . urlencode($email) . "\n\n";
        $message .= "If you did not request a password reset, please ignore this email.";
        $headers = "From: no-reply@yourwebsite.com";

        // Send the email
        if (mail($email, $subject, $message, $headers)) {
            echo "A password reset link has been sent to your email.";
        } else {
            echo "There was an error sending the email. Please try again.";
        }
    } else {
        echo "Please enter a valid email address.";
    }
}
?>
