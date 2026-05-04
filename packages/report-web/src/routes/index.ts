// Routes barrel — this file is built as a separate tsup entry and exported
// via `@usb-ui-test/report-web/routes`.
//
// Two consumers:
//   1. The standalone CLI-hosted SPA (src/main.tsx) — uses StandaloneReportApp
//      with defaultCliDataSource, which fetches /api/report/* from the CLI's
//      local HTTP server.
//   2. Other host apps — spread reportRouteObjects({...}) into a parent
//      React Router v7 data router while wiring their own data source.

export {
  StandaloneReportApp,
  reportRouteObjects,
  defaultCliDataSource,
} from './StandaloneReportApp';
export type { ReportDataSource, ReportRouteObjectsOptions } from './StandaloneReportApp';
