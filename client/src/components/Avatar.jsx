import "./avatar.css";

export default function Avatar({ user }) {
  if (user.avatar) {
    return <img className="avatar" src={user.avatar} alt="" />;
  }
  return <span className="avatar">{user.username[0].toUpperCase()}</span>;
}