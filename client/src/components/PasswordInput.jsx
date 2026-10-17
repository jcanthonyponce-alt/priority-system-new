import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import "./passwordinput.css";

export default function PasswordInput({ value, onChange, placeholder, autoFocus, autoComplete }) {
  const [show, setShow] = useState(false);

  return (
    <div className="pw-wrap">
      <input
        type={show ? "text" : "password"}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoFocus={autoFocus}
        autoComplete={autoComplete}
      />
      <button
        type="button"
        className="pw-toggle"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? "Hide password" : "Show password"}
        title={show ? "Hide password" : "Show password"}
      >
        {show ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
}