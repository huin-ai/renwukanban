import React from "react";
import ErrorState from "./ErrorState.jsx";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error) {
    console.error("ErrorBoundary caught:", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorState
          title="页面发生错误"
          message={this.state.error?.message || "未知错误"}
          actionText="刷新页面"
          onAction={() => window.location.reload()}
        />
      );
    }
    return this.props.children;
  }
}