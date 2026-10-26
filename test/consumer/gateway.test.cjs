// Jest runs CommonJS through vm.Script, where a native import() fails unless Node has --experimental-vm-modules.
require('reflect-metadata');
const { Module } = require('@nestjs/common');
const { NestFactory } = require('@nestjs/core');
const { WsException } = require('@nestjs/websockets');
const {
  TurnstileGuard,
  TurnstileModule,
} = require('nest-cloudflare-turnstile');

class AppGateway {
  join() {}
}

/** The context Nest hands to guards for a gateway message that has no token. */
const messageWithoutToken = {
  getType: () => 'ws',
  getClass: () => AppGateway,
  getHandler: () => AppGateway.prototype.join,
  switchToWs: () => ({ getClient: () => ({}), getData: () => ({}) }),
};

test('rejects a gateway message without a token with a WsException', async () => {
  class AppModule {}
  Module({
    imports: [
      TurnstileModule.forRoot({
        secretKey: '1x0000000000000000000000000000000AA',
      }),
    ],
  })(AppModule);
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: false,
  });
  try {
    const error = await app
      .get(TurnstileGuard)
      .canActivate(messageWithoutToken)
      .catch((caught) => caught);

    expect(error).toBeInstanceOf(WsException);
    expect(error.getError()).toBe('Missing turnstile verification code.');
  } finally {
    await app.close();
  }
});
