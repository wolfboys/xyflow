/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Writable } from 'svelte/store';
import { select } from 'd3-selection';
import { zoom as d3Zoom, zoomIdentity, type D3ZoomEvent } from 'd3-zoom';
import type { D3SelectionInstance, D3ZoomInstance, Transform, Viewport } from '@reactflow/system';
import { clamp } from '@reactflow/utils';

const isWrappedWithClass = (event: any, className: string | undefined) =>
  event.target.closest(`.${className}`);

function filter(event: any, params: ZoomParams): boolean {
  const zoomScroll = true;
  const pinchZoom = true;

  if (
    event.button === 1 &&
    event.type === 'mousedown' &&
    (isWrappedWithClass(event, 'svelte-flow__node') ||
      isWrappedWithClass(event, 'svelte-flow__edge'))
  ) {
    return true;
  }

  // if all interactions are disabled, we prevent all zoom events
  // if (!panOnDrag && !zoomScroll && !panOnScroll && !zoomOnDoubleClick && !zoomOnPinch) {
  // 	return false;
  // }
  // // during a selection we prevent all other interactions
  if (params.selecting) {
    return false;
  }

  // // if zoom on double click is disabled, we prevent the double click event
  // if (!zoomOnDoubleClick && event.type === 'dblclick') {
  // 	return false;
  // }

  // // if the target element is inside an element with the nowheel class, we prevent zooming
  // if (isWrappedWithClass(event, noWheelClassName) && event.type === 'wheel') {
  // 	return false;
  // }

  // // if the target element is inside an element with the nopan class, we prevent panning
  if (isWrappedWithClass(event, 'nopan') && event.type !== 'wheel') {
    return false;
  }

  // if (!zoomOnPinch && event.ctrlKey && event.type === 'wheel') {
  // 	return false;
  // }

  // // when there is no scroll handling enabled, we prevent all wheel events
  // if (!zoomScroll && !panOnScroll && !pinchZoom && event.type === 'wheel') {
  // 	return false;
  // }

  // // if the pane is not movable, we prevent dragging it with mousestart or touchstart
  // if (!panOnDrag && (event.type === 'mousedown' || event.type === 'touchstart')) {
  // 	return false;
  // }

  // // if the pane is only movable using allowed clicks
  // if (
  // 	Array.isArray(panOnDrag) &&
  // 	!panOnDrag.includes(event.button) &&
  // 	(event.type === 'mousedown' || event.type === 'touchstart')
  // ) {
  // 	return false;
  // }

  // // We only allow right clicks if pan on drag is set to right click
  // const buttonAllowed =
  // 	(Array.isArray(panOnDrag) && panOnDrag.includes(event.button)) ||
  // 	!event.button ||
  // 	event.button <= 1;

  // default filter for d3-zoom
  return ((!event.ctrlKey || event.type === 'wheel') && !event.button) || event.button <= 1;
}

type ZoomParams = {
  transform: Writable<Transform>;
  selecting: boolean;
  d3: Writable<{ zoom: D3ZoomInstance | null; selection: D3SelectionInstance | null }>;
  minZoom: number;
  maxZoom: number;
  initialViewport: Viewport;
};

export default function zoom(domNode: Element, params: ZoomParams) {
  const { transform, d3, minZoom, maxZoom, initialViewport } = params;
  const d3ZoomInstance = d3Zoom().scaleExtent([minZoom, maxZoom]);
  const selection = select(domNode).call(d3ZoomInstance);

  const updatedTransform = zoomIdentity
    .translate(initialViewport.x, initialViewport.y)
    .scale(clamp(initialViewport.zoom, minZoom, maxZoom));

  const d3ZoomHandler = selection.on('wheel.zoom');

  d3ZoomInstance.on('zoom', (event: D3ZoomEvent<HTMLDivElement, any>) => {
    transform.set([event.transform.x, event.transform.y, event.transform.k]);
  });

  d3ZoomInstance.transform(selection, updatedTransform);

  selection.on('wheel.zoom', function (event: any, d: any) {
    if (isWrappedWithClass(event, 'nowheel')) {
      return null;
    }

    event.preventDefault();
    d3ZoomHandler!.call(this, event, d);
  });

  d3.set({
    zoom: d3ZoomInstance,
    selection
  });

  d3ZoomInstance.filter((event: any) => filter(event, params));

  return {
    update(params: ZoomParams) {
      d3ZoomInstance.filter((event: any) => filter(event, params));
    }
  };
}