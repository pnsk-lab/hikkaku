import { DevEnvironment, type HotChannel, type ResolvedConfig, type WebSocketServer } from "vite";
import { ESModulesEvaluator, ModuleRunner, type ModuleRunnerTransport } from "vite/module-runner";

export function createHikkakuEnvironment(
  name: string,
  config: ResolvedConfig,
  context: {
    ws: WebSocketServer
  }
): DevEnvironment {
  const transport: ModuleRunnerTransport = {
    send: (data) => {
      console.log("sent", data);
    },
    connect(handlers) {
      
    },
    
    
  };

  const env = new (class extends DevEnvironment {
    runner: ModuleRunner;
    constructor(name: string, config: any, context: { hot: boolean; transport?: HotChannel }) {
      super(name, config, context);
      this.runner = new ModuleRunner(
        { transport: this.hot },
        new ESModulesEvaluator(),
      )
    }
  })(name, config, {
    transport,
    hot: true,
  });

  return env
}
