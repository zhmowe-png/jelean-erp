import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}
interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex h-screen items-center justify-center bg-gray-100">
          <div className="bg-white rounded-lg border p-8 max-w-md text-center shadow-lg">
            <div className="text-red-500 text-4xl mb-3">!</div>
            <h1 className="text-lg font-bold mb-2">页面出现错误</h1>
            <p className="text-sm text-gray-500 mb-4 break-all">
              {this.state.error.message}
            </p>
            <button
              onClick={() => {
                this.setState({ error: null });
                window.location.href = "/";
              }}
              className="px-4 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
            >
              回到首页
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
