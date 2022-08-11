import { loadNgModule } from '../lazyLoad/lazyLoadNgModule';
/**
 * This is a [[StateBuilder.builder]] function for ngModule lazy loading in Angular.
 *
 * When the [[StateBuilder]] builds a [[State]] object from a raw [[StateDeclaration]], this builder
 * decorates the `lazyLoad` property for states that have a [[Ng2StateDeclaration.ngModule]] declaration.
 *
 * If the state has a [[Ng2StateDeclaration.ngModule]], it will create a `lazyLoad` function
 * that in turn calls `loadNgModule(loadNgModuleFn)`.
 *
 * #### Example:
 * A state that has a `ngModule`
 * ```js
 * var decl = {
 *   ngModule: () => import('./childModule.ts')
 * }
 * ```
 * would build a state with a `lazyLoad` function like:
 * ```js
 * import { loadNgModule } from "@uirouter/angular";
 * var decl = {
 *   lazyLoad: loadNgModule(() => import('./childModule.ts')
 * }
 * ```
 *
 * If the state has both a `ngModule:` *and* a `lazyLoad`, then the `lazyLoad` is run first.
 *
 * #### Example:
 * ```js
 * var decl = {
 *   lazyLoad: () => import('third-party-library'),
 *   ngModule: () => import('./childModule.ts')
 * }
 * ```
 * would build a state with a `lazyLoad` function like:
 * ```js
 * import { loadNgModule } from "@uirouter/angular";
 * var decl = {
 *   lazyLoad: () => import('third-party-library')
 *       .then(() => loadNgModule(() => import('./childModule.ts'))
 * }
 * ```
 *
 */
export function ng2LazyLoadBuilder(state, parent) {
    const loadNgModuleFn = state['loadChildren'];
    return loadNgModuleFn ? loadNgModule(loadNgModuleFn) : state.lazyLoad;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGF6eUxvYWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvc3RhdGVidWlsZGVycy9sYXp5TG9hZC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFFQSxPQUFPLEVBQUUsWUFBWSxFQUFFLE1BQU0sOEJBQThCLENBQUM7QUFFNUQ7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztHQTBDRztBQUNILE1BQU0sVUFBVSxrQkFBa0IsQ0FBQyxLQUFrQixFQUFFLE1BQXVCO0lBQzVFLE1BQU0sY0FBYyxHQUFHLEtBQUssQ0FBQyxjQUFjLENBQUMsQ0FBQztJQUM3QyxPQUFPLGNBQWMsQ0FBQyxDQUFDLENBQUMsWUFBWSxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDO0FBQ3hFLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBMYXp5TG9hZFJlc3VsdCwgVHJhbnNpdGlvbiwgU3RhdGVEZWNsYXJhdGlvbiB9IGZyb20gJ0B1aXJvdXRlci9jb3JlJzsgLy8gaGFzIG9yIGlzIHVzaW5nXG5pbXBvcnQgeyBCdWlsZGVyRnVuY3Rpb24sIFN0YXRlT2JqZWN0IH0gZnJvbSAnQHVpcm91dGVyL2NvcmUnO1xuaW1wb3J0IHsgbG9hZE5nTW9kdWxlIH0gZnJvbSAnLi4vbGF6eUxvYWQvbGF6eUxvYWROZ01vZHVsZSc7XG5cbi8qKlxuICogVGhpcyBpcyBhIFtbU3RhdGVCdWlsZGVyLmJ1aWxkZXJdXSBmdW5jdGlvbiBmb3IgbmdNb2R1bGUgbGF6eSBsb2FkaW5nIGluIEFuZ3VsYXIuXG4gKlxuICogV2hlbiB0aGUgW1tTdGF0ZUJ1aWxkZXJdXSBidWlsZHMgYSBbW1N0YXRlXV0gb2JqZWN0IGZyb20gYSByYXcgW1tTdGF0ZURlY2xhcmF0aW9uXV0sIHRoaXMgYnVpbGRlclxuICogZGVjb3JhdGVzIHRoZSBgbGF6eUxvYWRgIHByb3BlcnR5IGZvciBzdGF0ZXMgdGhhdCBoYXZlIGEgW1tOZzJTdGF0ZURlY2xhcmF0aW9uLm5nTW9kdWxlXV0gZGVjbGFyYXRpb24uXG4gKlxuICogSWYgdGhlIHN0YXRlIGhhcyBhIFtbTmcyU3RhdGVEZWNsYXJhdGlvbi5uZ01vZHVsZV1dLCBpdCB3aWxsIGNyZWF0ZSBhIGBsYXp5TG9hZGAgZnVuY3Rpb25cbiAqIHRoYXQgaW4gdHVybiBjYWxscyBgbG9hZE5nTW9kdWxlKGxvYWROZ01vZHVsZUZuKWAuXG4gKlxuICogIyMjIyBFeGFtcGxlOlxuICogQSBzdGF0ZSB0aGF0IGhhcyBhIGBuZ01vZHVsZWBcbiAqIGBgYGpzXG4gKiB2YXIgZGVjbCA9IHtcbiAqICAgbmdNb2R1bGU6ICgpID0+IGltcG9ydCgnLi9jaGlsZE1vZHVsZS50cycpXG4gKiB9XG4gKiBgYGBcbiAqIHdvdWxkIGJ1aWxkIGEgc3RhdGUgd2l0aCBhIGBsYXp5TG9hZGAgZnVuY3Rpb24gbGlrZTpcbiAqIGBgYGpzXG4gKiBpbXBvcnQgeyBsb2FkTmdNb2R1bGUgfSBmcm9tIFwiQHVpcm91dGVyL2FuZ3VsYXJcIjtcbiAqIHZhciBkZWNsID0ge1xuICogICBsYXp5TG9hZDogbG9hZE5nTW9kdWxlKCgpID0+IGltcG9ydCgnLi9jaGlsZE1vZHVsZS50cycpXG4gKiB9XG4gKiBgYGBcbiAqXG4gKiBJZiB0aGUgc3RhdGUgaGFzIGJvdGggYSBgbmdNb2R1bGU6YCAqYW5kKiBhIGBsYXp5TG9hZGAsIHRoZW4gdGhlIGBsYXp5TG9hZGAgaXMgcnVuIGZpcnN0LlxuICpcbiAqICMjIyMgRXhhbXBsZTpcbiAqIGBgYGpzXG4gKiB2YXIgZGVjbCA9IHtcbiAqICAgbGF6eUxvYWQ6ICgpID0+IGltcG9ydCgndGhpcmQtcGFydHktbGlicmFyeScpLFxuICogICBuZ01vZHVsZTogKCkgPT4gaW1wb3J0KCcuL2NoaWxkTW9kdWxlLnRzJylcbiAqIH1cbiAqIGBgYFxuICogd291bGQgYnVpbGQgYSBzdGF0ZSB3aXRoIGEgYGxhenlMb2FkYCBmdW5jdGlvbiBsaWtlOlxuICogYGBganNcbiAqIGltcG9ydCB7IGxvYWROZ01vZHVsZSB9IGZyb20gXCJAdWlyb3V0ZXIvYW5ndWxhclwiO1xuICogdmFyIGRlY2wgPSB7XG4gKiAgIGxhenlMb2FkOiAoKSA9PiBpbXBvcnQoJ3RoaXJkLXBhcnR5LWxpYnJhcnknKVxuICogICAgICAgLnRoZW4oKCkgPT4gbG9hZE5nTW9kdWxlKCgpID0+IGltcG9ydCgnLi9jaGlsZE1vZHVsZS50cycpKVxuICogfVxuICogYGBgXG4gKlxuICovXG5leHBvcnQgZnVuY3Rpb24gbmcyTGF6eUxvYWRCdWlsZGVyKHN0YXRlOiBTdGF0ZU9iamVjdCwgcGFyZW50OiBCdWlsZGVyRnVuY3Rpb24pIHtcbiAgY29uc3QgbG9hZE5nTW9kdWxlRm4gPSBzdGF0ZVsnbG9hZENoaWxkcmVuJ107XG4gIHJldHVybiBsb2FkTmdNb2R1bGVGbiA/IGxvYWROZ01vZHVsZShsb2FkTmdNb2R1bGVGbikgOiBzdGF0ZS5sYXp5TG9hZDtcbn1cbiJdfQ==