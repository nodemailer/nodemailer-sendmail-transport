'use strict';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

var chai = require('chai');
var expect = chai.expect;
var PassThrough = require('stream').PassThrough;
var EventEmitter = require('events').EventEmitter;
var sinon = require('sinon');
var sendmailTransport = require('../src/sendmail-transport');
chai.Assertion.includeStack = true;

function MockBuilder(envelope, message) {
    this.envelope = envelope;
    this.message = new PassThrough();
    this.message.end(message);
}

MockBuilder.prototype.getEnvelope = function() {
    return this.envelope;
};

MockBuilder.prototype.getHeader = function() {
    return 'teretere';
};

MockBuilder.prototype.createReadStream = function() {
    return this.message;
};

describe('Sendmail Transport Tests', function() {
    it('Should expose version number', function() {
        var client = sendmailTransport();
        expect(client.name).to.exist;
        expect(client.version).to.exist;
    });

    it('Should send message', function(done) {
        var client = sendmailTransport();

        var stubbedSpawn = new EventEmitter();
        stubbedSpawn.stdin = new PassThrough();
        stubbedSpawn.stdout = new PassThrough();

        var output = '';
        stubbedSpawn.stdin.on('data', function(chunk) {
            output += chunk.toString();
        });

        stubbedSpawn.stdin.on('end', function() {
            stubbedSpawn.emit('close', 0);
            stubbedSpawn.emit('exit', 0);
        });

        sinon.stub(client, '_spawn').returns(stubbedSpawn);

        client.send({
            data: {},
            message: new MockBuilder({
                from: 'test@valid.sender',
                to: 'test@valid.recipient'
            }, 'message\r\nline 2')
        }, function(err, data) {
            expect(err).to.not.exist;
            expect(data.messageId).to.equal('teretere');
            expect(output).to.equal('message\nline 2');
            client._spawn.restore();
            done();
        });
    });

    it('Should return an error', function(done) {
        var client = sendmailTransport();

        var stubbedSpawn = new EventEmitter();
        stubbedSpawn.stdin = new PassThrough();
        stubbedSpawn.stdout = new PassThrough();

        var output = '';
        stubbedSpawn.stdin.on('data', function(chunk) {
            output += chunk.toString();
        });

        stubbedSpawn.stdin.on('end', function() {
            stubbedSpawn.emit('close', 127);
            stubbedSpawn.emit('exit', 127);
        });

        sinon.stub(client, '_spawn').returns(stubbedSpawn);

        client.send({
            data: {},
            message: new MockBuilder({
                from: 'test@valid.sender',
                to: 'test@valid.recipient'
            }, 'message\r\nline 2')
        }, function(err, data) {
            expect(err).to.exist;
            expect(data).to.not.exist;
            client._spawn.restore();
            done();
        });
    });
});