declare module "splitting" {
  type Result = { el: HTMLElement; words?: HTMLElement[]; chars?: HTMLElement[]; lines?: HTMLElement[][] };
  function Splitting(opts: { target: Element | Element[] | string; by?: string; force?: boolean; key?: string }): Result[];
  export default Splitting;
}
