export function asyncActions() {
  return (next) => (action) => {
    if (action.payload instanceof Promise) {
      action.payload.then(result => next({...action, payload: result}));
    } else {
      next(action);
    }
  }
}
