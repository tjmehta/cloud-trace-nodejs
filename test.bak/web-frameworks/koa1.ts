/**
 * Copyright 2018 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import * as http from 'http';

import {koa_1} from '../../src/plugins/types';
import * as trace from '../trace';

import {WebFramework, WebFrameworkAddHandlerOptions, WebFrameworkResponse} from './base';

export class Koa1 implements WebFramework {
  static commonName = 'koa@1';
  static expectedTopStackFrame = 'middleware';
  static versionRange = '*';
  app: koa_1;
  server: http.Server|null = null;

  constructor() {
    // tslint:disable-next-line:variable-name (Koa is a constructor)
    const Koa = require('../plugins/fixtures/koa1') as typeof koa_1;
    this.app = new Koa();
  }

  addHandler(options: WebFrameworkAddHandlerOptions): void {
    this.app.use(function*(next) {
      if (this.request.path === options.path) {
        // Context doesn't automatically get propagated to yielded functions.
        yield trace.get().wrap(async (cb: Function) => {
          let response: WebFrameworkResponse|void;
          try {
            response = await options.fn();
          } catch (err) {
            cb(err);
            return;
          }
          if (response) {
            this.response.status = response.statusCode;
            this.response.body = response.message;
          }
          cb();
        });
      }
      yield* next;
    });
  }

  listen(port: number): number {
    this.app.on('error', () => {/* silence error */});
    if (this.server) {
      throw new Error('Server already running.');
    }
    this.server = this.app.listen(port);
    return this.server!.address().port;
  }

  shutdown(): void {
    if (!this.server) {
      throw new Error('No server running');
    }
    this.server.close();
    this.server = null;
  }
}
