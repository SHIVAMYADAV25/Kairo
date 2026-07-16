import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("Kairo crashed:", error, info);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-screen w-screen flex-col items-center justify-center gap-4 bg-[var(--c-0b0b0b)] text-text-primary">
          <div className="text-lg font-semibold">Something went wrong</div>
          <div className="max-w-md text-center text-[13px] text-text-muted">
            {this.state.error?.message ?? "An unexpected error occurred."}
          </div>
          <button
            onClick={this.handleReload}
            className="rounded bg-[#F54900] px-4 py-1.5 text-[12px] font-semibold text-[#FDFFFF] hover:bg-[#e04300]"
          >
            Reload Kairo
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}