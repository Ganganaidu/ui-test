import { ReactElement } from 'react';
import { RouteObject } from 'react-router-dom';
import { R as ReportIndexViewModel, a as ReportRunManifest } from '../artifacts-B5l10l25.mjs';
import '@usb-ui-test/common';

interface ReportDataSource {
    fetchIndex(): Promise<ReportIndexViewModel>;
    fetchRun(runId: string): Promise<ReportRunManifest>;
}
declare const defaultCliDataSource: ReportDataSource;
interface ReportRouteObjectsOptions {
    dataSource: ReportDataSource;
    indexPath?: string;
    detailPath?: string;
    backHref?: string;
}
declare function reportRouteObjects(options: ReportRouteObjectsOptions): RouteObject[];
declare function StandaloneReportApp({ dataSource, }?: {
    dataSource?: ReportDataSource;
}): ReactElement;

export { type ReportDataSource, type ReportRouteObjectsOptions, StandaloneReportApp, defaultCliDataSource, reportRouteObjects };
