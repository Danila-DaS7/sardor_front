import React from "react";

export default class AdminErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error) {
    console.error("AdminErrorBoundary caught:", error);
  }

  render() {
    const { error } = this.state;
    if (!error) {
      return this.props.children;
    }

    const message = error?.message || "Unknown error";
    const isForbidden = /forbidden|unauthorized/i.test(message);

    return (
      <div className="admin">
        <div className="admin__card">
          <h1>Админка недоступна</h1>
          <p>{message}</p>
          {isForbidden && (
            <p>
              Откройте админку в Telegram WebApp или войдите через Telegram.
              Убедитесь, что ваш Telegram ID добавлен в список админов.
            </p>
          )}
        </div>
      </div>
    );
  }
}
