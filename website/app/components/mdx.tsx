import defaultMdxComponents from 'fumadocs-ui/mdx';
import type { MDXComponents } from 'mdx/types';
import {
  CoreObjectDiagram,
  ExecutionPathDiagram,
  LifecycleTimelineDiagram,
  ProtocolPositioningDiagram,
  RepoStructureDiagram,
  RuntimeBoundaryDiagram,
  SystemAtAGlanceDiagram,
} from './diagrams';

export function getMDXComponents(components?: MDXComponents) {
  return {
    ...defaultMdxComponents,
    CoreObjectDiagram,
    ExecutionPathDiagram,
    LifecycleTimelineDiagram,
    ProtocolPositioningDiagram,
    RepoStructureDiagram,
    RuntimeBoundaryDiagram,
    SystemAtAGlanceDiagram,
    ...components,
  } satisfies MDXComponents;
}

export const useMDXComponents = getMDXComponents;
